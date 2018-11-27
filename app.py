import datetime
import os

from flask import Flask, render_template, redirect, url_for, send_from_directory
from forms import SignupForm

from models import Signups
from database import db_session

app = Flask(__name__)
app.secret_key = os.environ['APP_SECRET_KEY']

# Routes
@app.route('/')
def root():
    return redirect("static/index.html", code=302)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5090, debug=True)
