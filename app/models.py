from app import db
from flask_security import RoleMixin
from datetime import datetime

# Define associations

friends = db.Table('friends',
    db.Column('friend_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('friended_id', db.Integer, db.ForeignKey('user.id'))
)

events = db.Table('events',
                  db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
                  db.Column('event_id', db.Integer, db.ForeignKey('event.id'))
)

roles_users = db.Table('roles_users',
        db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
        db.Column('role_id', db.Integer(), db.ForeignKey('role.id')))

# Define models

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    longitude = db.Column(db.Integer)
    latitude = db.Column(db.Integer)

    google_id = db.Column(db.String, unique=True)

    roles = db.relationship('Role',
                            secondary=roles_users,
                            backref=db.backref('users', lazy='dynamic'))

    connections = db.relationship('Connection',
                                  backref=db.backref('user', lazy='joined'),
                                  cascade="all", uselist=False)
    active = False

    friended = db.relationship('User',
                               secondary=friends,
                               primaryjoin=(friends.c.friend_id == id),
                               secondaryjoin=(friends.c.friended_id == id),
                               backref=db.backref('friends', lazy='dynamic'),
                               lazy='dynamic')

    events = db.relationship('Event', secondary=events,
                            backref=db.backref('events', lazy='dynamic'))

    def __init__(self, google_id, active, roles):
        self.google_id = google_id
        self.active = active
        self.roles = roles

    def location(self):
        return {'longitude':self.longitude, 'latitude':self.latitude}

    def set_location(self, location):
        self.longitude = location['longitude']
        self.latitude = location['latitude']
        db.session.commit()

    def add_event(self, event):
        self.events.append(event)
        db.session.commit()

    def remove_event(self, event):
        self.events.remove(event)
        db.session.commit()

    def friend(self, user):
        if not self.is_friend(user):
            self.friended.append(user)
            db.session.commit()
            return self

    def unfriend(self, user):
        if self.is_friend(user):
            self.friended.remove(user)
            db.session.commit()
            return self

    def is_friend(self, user):
        return self.friended.filter(friends.c.friended_id == user.id).count() > 0

    def get_user(self):
        return {self.id:self.connections.full_name}

    def get_name(self):
        return self.connections.full_name

    def has_role(self, role_check):
        return role_check in self.roles

    def is_active(self):
        return True

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def __repr__(self):
        return "<Google ID {}>".format(self.google_id)


class Connection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    provider_id = db.Column(db.String(255))
    full_name = db.Column(db.String(255))
    provider_user_id = db.Column(db.String(255))
    access_token = db.Column(db.String(255))
    secret = db.Column(db.String(255))
    display_name = db.Column(db.String(255))
    profile_url = db.Column(db.String(512))
    image_url = db.Column(db.String(512))
    rank = db.Column(db.Integer)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    description = db.Column(db.String(255))
    longitude = db.Column(db.Float(precision=8))
    latitude = db.Column(db.Float(precision=8))
    start_datetime = db.Column(db.DateTime)
    end_datetime = db.Column(db.DateTime)

    def __init__(self, location, title, description, start_date=None, end_date=None):

        self.title = title
        self.description = description

        self.start_date = start_date or datetime.now()
        self.end_date = end_date or datetime.now()

        self.longitude = location['longitude']
        self.latitude = location['latitude']

    def location(self):
        return {'longitude':self.longitude, 'latitude':self.latitude}

    def __repr__(self):
        return str(self.location())


db.create_all()