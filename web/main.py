# from flask import Flask
# app = Flask(__name__)

from cloudant import Cloudant
from flask import Flask, render_template, request, jsonify
from flask_session import Session
from flaskext.markdown import Markdown
from flask.ext.bcrypt import Bcrypt
import atexit
import os
import json

from dotmap import DotMap
from flask_pymongo import PyMongo

from recipetomarkdown import ParseRecipe

import routes

app = Flask(__name__, static_url_path='')
# app.config.
app.config['MONGO_URI'] = 'mongodb://localhost:27017/recipes'
app.secret_key = 'DO NOT CHANGE ME; I AM A PERFECTLY ADEQUATE SECRET KEY. LOOK HOW WONDERFULLY LONG I AM. I DON\'T REALLY KNOW HOW THIS WORKS'
app.config['SESSION_TYPE'] = 'filesystem'
mongo = PyMongo(app)
Session(app)
Markdown(app)
bcrypt = Bcrypt(app)


if 'VCAP_SERVICES' in os.environ:
	 vcap = json.loads(os.getenv('VCAP_SERVICES'))
	 print('Found VCAP_SERVICES')
	 if 'cloudantNoSQLDB' in vcap:
		  creds = vcap['cloudantNoSQLDB'][0]['credentials']
		  user = creds['username']
		  password = creds['password']
		  url = 'https://' + creds['host']
		  client = Cloudant(user, password, url=url, connect=True)
		  db = client.create_database(db_name, throw_on_exists=False)
elif "CLOUDANT_URL" in os.environ:
	 client = Cloudant(os.environ['CLOUDANT_USERNAME'], os.environ['CLOUDANT_PASSWORD'], url=os.environ['CLOUDANT_URL'], connect=True)
	 db = client.create_database(db_name, throw_on_exists=False)
elif os.path.isfile('vcap-local.json'):
	 with open('vcap-local.json') as f:
		  vcap = json.load(f)
		  print('Found local VCAP_SERVICES')
		  creds = vcap['services']['cloudantNoSQLDB'][0]['credentials']
		  user = creds['username']
		  password = creds['password']
		  url = 'https://' + creds['host']
		  client = Cloudant(user, password, url=url, connect=True)
		  db = client.create_database(db_name, throw_on_exists=False)

# On IBM Cloud Cloud Foundry, get the port number from the environment variable PORT
# When running this app on the local machine, default the port to 8000
port = int(os.getenv('PORT', 8000))


routes.AddRoutes(app, mongo.db, bcrypt)
		  

@atexit.register
def shutdown():
	pass
	#do shutdown stuff
	
	
if __name__ == '__main__':
	 app.run(host='0.0.0.0', port=port, debug=True)
