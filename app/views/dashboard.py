from flask import render_template
from flask_security.core import roles_required
from app import app


@app.route('/dashboard')
@roles_required('Admin')
def dashboard():
    return render_template("dashboard.html")