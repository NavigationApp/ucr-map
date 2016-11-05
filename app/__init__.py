from __future__ import print_function

import os

from flask import Flask
from flask_sslify import SSLify
from flask_sqlalchemy import SQLAlchemy
from flask.ext.security import Security, SQLAlchemyUserDatastore
app = Flask(__name__)

# Setting up SSL
sslify = SSLify(app)
app.secret_key = os.environ["SECRET"]
app.debug = False

# Setting up database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
db = SQLAlchemy(app) # This is the main db connection that should be passed around

# Setting up file for oauth2client to read
# Todo: Migrate away from oauth2client -> Flask-Social
with open("client.txt", "w") as text_file:
    print(os.environ["GOOGLE"], file=text_file)

# Setup Flask-Security
from app.models import User, Role, Connection
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# Initiating views
from views import index, login, logout
