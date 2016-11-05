from flask import render_template
from flask_security.core import current_user
from app import app


@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template("index.html", result=current_user.connections.full_name)
    return render_template("index.html")