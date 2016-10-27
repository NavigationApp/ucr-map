from flask import render_template,session
from app import app

@app.route('/')
def index():
    return render_template("index.html", result=session['credentials']['id_token']['email'] if session['credentials']['id_token']['email'] else None)
