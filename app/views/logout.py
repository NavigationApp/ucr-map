from flask import url_for, redirect,session
from app import app
from flask_security.utils import logout_user



@app.route('/logout/')
def logout():
    logout_user()
    return redirect(url_gfor("index"))
