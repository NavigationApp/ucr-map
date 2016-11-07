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
    role = app.user_datastore.find_or_create_role(role)
    user = app.user_datastore.get_user(id)
    app.user_datastore.add_role_to_user(user, role)
    return render_template("dashboard.html")


@app.route('/dashboard/delete/<id>')
@roles_required('Admin')
def dashboard_delete(id):
    user = User.query.filter_by(id=id).first()
    app.user_datastore.delete_user(user)
    return render_template("dashboard.html")