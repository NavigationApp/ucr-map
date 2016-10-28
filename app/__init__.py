from __future__ import print_function

import os
from flask import Flask

app = Flask(__name__)
app.secret_key = os.environ["SECRET"]

with open("client.txt", "w") as text_file:
    print(os.environ["GOOGLE"], file=text_file)

from views import index, login, logout
