import redis
import time
import random

from flask import Flask, request, render_template, redirect, url_for
from flask.json import jsonify


app = Flask(__name__)
pool = redis.ConnectionPool(host='localhost', db=0)
SPACE = "abcdefghijklmnopqrstuvwxyz0123456789"
client = redis.Redis(connection_pool=pool)


@app.route('/')
def index():
    return render_template("index.html")

def gen_random_str(length):
    random_str = ""
    random_str += "".join([random.choice(SPACE) for ii in range(length)])
    return random_str

def uniq_random_str():
    random_str = gen_random_str(4)
    num_fields = client.hlen(random_str)
    if num_fields > 1:
        return uniq_random_str()
    return random_str

@app.route('/new')
def new_track():
    random_str = uniq_random_str()
    return redirect(url_for('track', track_id=random_str))

@app.route('/<track_id>', methods=['GET', 'POST'])
def track(track_id):
    track = client.hgetall(track_id)
    if request.method == 'POST':
        key = request.cookies["nick"] + "||" + request.cookies["sid"]
        loc = request.form["loc"]
        client.hmset(track_id, {key: loc})
        curr_time = int(time.time())
        client.expireat(track_id, curr_time + 3600)
        track = client.hgetall(track_id)
    if request.is_xhr:
        return jsonify(track=track)
    return render_template("track.html", track=track)


if __name__ == '__main__':
    app.run()
