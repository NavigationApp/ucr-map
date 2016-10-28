from __future__ import print_function

import os
from flask import Flask,request,redirect

app = Flask(__name__)
app.secret_key = os.environ["SECRET"]

with open("client.txt", "w") as text_file:
    print(os.environ["GOOGLE"], file=text_file)

@app.before_request
def before_request():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        code = 301
        return redirect(url, code=code)

from views import index, login, logout
