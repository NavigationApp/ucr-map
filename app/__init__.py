from __future__ import print_function

import os
from flask import Flask
from flask_sslify import SSLify

app = Flask(__name__)
sslify = SSLify(app)
app.secret_key = os.environ["SECRET"]
app.debug = False

with open("client.txt", "w") as text_file:
    print(os.environ["GOOGLE"], file=text_file)

from views import index, login, logout
