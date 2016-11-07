from flask import render_template, request
from flask_security.decorators import roles_required
from flask_security.core import current_user
from app import app
from app.models import User


@app.route('/dashboard')
@roles_required('Admin')
def dashboard():
    users = User.query.all()
    return render_template("dashboard.html", user=current_user, users=users)


@app.route('/dashboard/<id>/<role>')
@roles_required('Admin')
def dashboard_edit(id, role):
    return render_template("index.html")


@app.route('/dashboard/delete/<id>')
@roles_required('Admin')
def dashboard_delete(id):
    user = User.query.find(id=id)
    User.delete(user)
    return render_template("index.html")