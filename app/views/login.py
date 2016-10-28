from flask import request, url_for, redirect,session
from app import app
import os
from oauth2client import client

import json


class FileSpoof(object):
    def __init__(self, my_text):
        self.my_text = my_text

    def readlines(self):
        return self.my_text.splitlines()

@app.route('/login/<provider_name>/', methods=['GET', 'POST'])
def login(provider_name):
    """
    Login handler, must accept both GET and POST to be able to use OpenID.
    """

    flow = client.flow_from_clientsecrets(
        FileSpoof(os.environ["GOOGLE"]),
        scope=['email','profile'],
        redirect_uri = url_for('login', provider_name="google", _external=True))
    if 'code' not in request.args:
        auth_uri = flow.step1_get_authorize_url()
        return redirect(auth_uri)
    else:
        auth_code = request.args.get('code')
        credentials = flow.step2_exchange(auth_code)
        session['credentials'] = json.loads(credentials.to_json())
        return redirect(url_for('index'))
