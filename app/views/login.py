from flask import request, url_for, redirect,session
from app import app
import os
from oauth2client import client
import StringIO
import json


@app.route('/login/<provider_name>/', methods=['GET', 'POST'])
def login(provider_name):
    """
    Login handler, must accept both GET and POST to be able to use OpenID.
    """
    output = StringIO.StringIO()
    output.write(os.environ["GOOGLE"])

    flow = client.flow_from_clientsecrets(
        "client.txt",
        scope=['email','profile'],
        redirect_uri = url_for('login', provider_name="google", _external=True))
    output.close()
    if 'code' not in request.args:
        auth_uri = flow.step1_get_authorize_url()
        return redirect(auth_uri)
    else:
        auth_code = request.args.get('code')
        credentials = flow.step2_exchange(auth_code)
        session['credentials'] = json.loads(credentials.to_json())
        return redirect(url_for('index'))
