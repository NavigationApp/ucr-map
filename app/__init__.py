from __future__ import print_function

import os

from flask import Flask, render_template, session, redirect, url_for
from flask_social import Social, login_failed
from flask_sslify import SSLify
from flask_sqlalchemy import SQLAlchemy
from flask.ext.heroku import Heroku
from flask.ext.social.datastore import SQLAlchemyConnectionDatastore
from flask_security import Security, SQLAlchemyUserDatastore, login_user, roles_required
from flask_security.core import current_user
from flask_social.views import connect_handler
from flask_socketio import SocketIO, emit
from fuzzywuzzy import process
from flask.ext.social.utils import get_connection_values_from_oauth_response
import twitter

app = Flask(__name__)
heroku = Heroku()

# Setting up SSL
#sslify = SSLify(app)
app.secret_key = os.environ.get('SECRET', 'DEV_SECRET')
app.debug = False

# Setting up database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///../../flask_app.db')
app.config['SQLALCHEMY_ECHO'] = False  # Too much overhead
db = SQLAlchemy(app)  # This is the main db connection that should be passed around

# Setting up OAuth
app.config['SOCIAL_GOOGLE'] = {
    'consumer_key': os.environ.get('GOOGLE_ID', "No ID"),
    'consumer_secret': os.environ.get('GOOGLE_SECRET', "No Secret")
}

# Setting up twitter api
parking_screen_name = '@UCRTAPS'
try:
    twitter_tokens = {}
    twitter_tokens['consumer_key'] = os.environ.get('TWITTER_CONSUMER_KEY')
    twitter_tokens['consumer_secret'] = os.environ.get('TWITTER_CONSUMER_SECRET')
    twitter_tokens['access_token_key'] = os.environ.get('TWITTER_ACCESS_TOKEN_KEY')
    twitter_tokens['access_token_secret'] = os.environ.get('TWITTER_ACCESS_TOKEN_SECRET')

    # # Change keys later
    # twitter_tokens['consumer_key'] = 'K21xRXLb1vIpBMqIylxsoD7Tl'
    # twitter_tokens['consumer_secret'] = 'asTuTpudCvC70TBnycVBRHYv4vYcTEHS0yE8Kxbgwx80pQbSJ8'
    # twitter_tokens['access_token_key'] = '2783017040-kXHB6bsEhTvGaGgkeONNPbaF023wfURHr53ItRs'
    # twitter_tokens['access_token_secret'] = '88SpaVwYKh1XlY4o8WXtritdm4v0YqV8bkqTEHbfM6jlb'

    twitter_api = twitter.Api(consumer_key=twitter_tokens['consumer_key'],
                              consumer_secret=twitter_tokens['consumer_secret'],
                              access_token_key=twitter_tokens['access_token_key'],
                              access_token_secret=twitter_tokens['access_token_secret'])
except:
    twitter_api = None

for k in twitter_tokens:
    if twitter_tokens[k] is None:
        twitter_api = None
        break

# Initiating views
from views import index, logout, dashboard

# Setup Flask-Security
from app.models import User, Role, Connection, Event

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
app.security = Security(app, user_datastore)
app.social = Social(app, SQLAlchemyConnectionDatastore(db, Connection))
heroku.init_app(app)

# Setting up sockets
async_mode = None

if async_mode is None:
    try:
        import eventlet

        async_mode = 'eventlet'
    except ImportError:
        pass

    if async_mode is None:
        try:
            from gevent import monkey

            async_mode = 'gevent'
        except ImportError:
            pass

    if async_mode is None:
        async_mode = 'threading'

    print('async_mode is ' + async_mode)

if async_mode == 'eventlet':
    import eventlet

    eventlet.monkey_patch()
elif async_mode == 'gevent':
    from gevent import monkey

    monkey.patch_all()

socketio = SocketIO(app, async_mode=async_mode)


def get_users_dict(users, names):
    for x in names:
        yield users.keys()[users.values().index(x[0])], x

# todo implement get_friends: it should get friends based on fuzzy search
@socketio.on('get_all_friends')
def get_all_friends_event():
    if current_user.is_authenticated:
        emit("my_friends", {f.get_id(): f.get_name() for f in current_user.friended})
    else:
        return False

@socketio.on('set_event')
def set_event_event(event):
    if current_user.is_authenticated:
        event = Event(event['location'], event['title'], event['desc'], start_date=event['date'])
        current_user.add_event(event)
    else:
        return False

@socketio.on('location')
def location_event(location):
    if current_user.is_authenticated:
        current_user.set_location(location)
    else:
        return False


@socketio.on('search')
def search_event(search):
    users = User.query.all()
    users = {x.id: x.connections.full_name for x in users}

    names = process.extract(search['search'], (users[key] for key in users), limit=10)
    names.sort(key=lambda x: x[1], reverse=True)

    emit("names", {x: y for x, y in get_users_dict(users, names)})


@socketio.on('add')
def add_event(add):
    if current_user.is_authenticated:
        friend_id = add['add']
        current_user.friend(user_datastore.get_user(friend_id))
    else:
        return False


@app.route('/dashboard/<id>/<role>')
@roles_required('Admin')
def dashboard_edit(id, role):
    role = user_datastore.find_or_create_role(role)
    user = user_datastore.get_user(id)
    user_datastore.add_role_to_user(user, role)
    db.session.commit()
    return redirect(url_for("dashboard", user=current_user, users=User.query.all()))


@app.route('/dashboard/delete/<id>')
@roles_required('Admin')
def dashboard_delete(id):
    user = User.query.filter_by(id=id).first()
    user_datastore.delete_user(user)
    db.session.commit()
    return redirect(url_for("dashboard", user=current_user, users=User.query.all()))


# Setting up new users
@login_failed.connect_via(app)
def on_login_failed(sender, provider, oauth_response):
    connection_values = get_connection_values_from_oauth_response(provider, oauth_response)
    connection_values['display_name'] = connection_values['display_name']['givenName'] + " " + \
                                        connection_values['display_name']['familyName']
    connection_values['full_name'] = connection_values['display_name']
    session['google_id'] = connection_values['provider_user_id']
    role = user_datastore.find_or_create_role("User")
    user = user_datastore.create_user(google_id=session['google_id'])
    user_datastore.add_role_to_user(user, role)
    user_datastore.commit()
    connection_values['user_id'] = user.id
    connect_handler(connection_values, provider)
    login_user(user)
    db.session.commit()
    return render_template('index.html')
