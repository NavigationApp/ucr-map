from flask import render_template
from flask_security.decorators import roles_required
from flask_security.core import current_user
from app import app, User


@app.route('/dashboard')
@roles_required('Admin')
def dashboard():
    users = User.query.all()
    return render_template("dashboard.html", user=current_user, users=users)