from __future__ import print_function

import os

from flask import Flask, render_template, session
from flask_social import Social, login_failed
from flask_sslify import SSLify
from flask_sqlalchemy import SQLAlchemy
from flask.ext.heroku import Heroku
from flask.ext.social.datastore import SQLAlchemyConnectionDatastore
from flask_security import Security, SQLAlchemyUserDatastore,login_user, roles_required
from flask_social.views import connect_handler
from flask.ext.social.utils import get_connection_values_from_oauth_response
from pprint import pprint
app = Flask(__name__)
heroku = Heroku()

# Setting up SSL
sslify = SSLify(app)
app.secret_key = os.environ["SECRET"]
app.debug = False

# Setting up database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
app.config['SQLALCHEMY_ECHO'] = False  # Too much overhead
db = SQLAlchemy(app) # This is the main db connection that should be passed around

# Setting up OAuth
app.config['SOCIAL_GOOGLE'] = {
                       'consumer_key': os.environ['GOOGLE_ID'],
                       'consumer_secret': os.environ['GOOGLE_SECRET']
                      }


# Initiating views
from views import index, logout, dashboard

# Setup Flask-Security
from app.models import User, Role, Connection
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
app.security = Security(app, user_datastore)
app.social = Social(app, SQLAlchemyConnectionDatastore(db, Connection))
heroku.init_app(app)

@app.route('/dashboard/<id>/<role>')
@roles_required('Admin')
def dashboard_edit(id, role):
    role = user_datastore.find_or_create_role(role)
    user = user_datastore.get_user(id)
    user_datastore.add_role_to_user(user, role)
    return render_template("dashboard.html")


@app.route('/dashboard/delete/<id>')
@roles_required('Admin')
def dashboard_delete(id):
    user = User.query.filter_by(id=id).first()
    user_datastore.delete_user(user)
    return render_template("dashboard.html")

# Setting up new users
@login_failed.connect_via(app)
def on_login_failed(sender, provider, oauth_response):
    connection_values = get_connection_values_from_oauth_response(provider, oauth_response)
    pprint(connection_values)
    connection_values['display_name'] = connection_values['display_name']['givenName'] +" "+ connection_values['display_name']['familyName']
    connection_values['full_name'] = connection_values['display_name']
    session['google_id'] = connection_values['provider_user_id']
    user = user_datastore.create_user(google_id=session['google_id'])
    user_datastore.commit()
    connection_values['user_id'] = user.id
    connect_handler(connection_values, provider)
    login_user(user)
    db.session.commit()
    return render_template('index.html')

