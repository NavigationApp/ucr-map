from flask import render_template
from flask_security.core import current_user
from app import app, twitter_api, parking_screen_name


def get_tweets():
    data = None
    if twitter_api and twitter_api.VerifyCredentials():
        tweets = twitter_api.GetUserTimeline(screen_name=parking_screen_name,count=3)
        for tweet in tweets:
            if 'avail' in tweet.text.lower():
                data = twitter_api.GetStatusOembed(status_id=tweet.id, hide_thread=True)
                return data['html']
                break
    return data

@app.route('/')
def index():
    tweet = get_tweets()
    if current_user.is_authenticated:
        return render_template("index.html", user=current_user, tweet=tweet, events=current_user.events)
    return render_template("index.html",tweet=tweet)
