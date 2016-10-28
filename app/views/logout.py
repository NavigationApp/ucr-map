from flask import request, url_for, redirect,session
from app import app
import os
from oauth2client import client
import StringIO
import json


@app.route('/logout/', methods=['GET', 'POST'])
def logout(provider_name):
    """
    Logout, must accept both GET and POST to be able to use OpenID.
    """
    del session['credentials']
    return redirect(url_for("index"))
