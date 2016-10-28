from flask import request, url_for, redirect,session
from app import app
import os
from oauth2client import client
import StringIO
import json


@app.route('/logout/')
def logout():
    """
    Logout, must accept both GET and POST to be able to use OpenID.
    """
    session.pop('credentials', None)
    return redirect(url_for("index"))
