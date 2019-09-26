from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, Markup
import json
import requests
from dotmap import DotMap

from bson.objectid import ObjectId

from recipetomarkdown import ParseRecipe

from .authentication import AuthenticationRoutes
# from flask_misaka import markdown

def AddRoutes(app, db, bcrypt):

	AuthenticationRoutes(app, db, bcrypt)

	@app.route('/', methods=['GET'])
	@app.route('/index', methods=['GET'])
	@app.route('/recipe_book', methods=['GET'])
	def RecipeBook():
		data = {'recipes': []}
		results = db.recipes.find({'owner': session['id']})
		for r in results:
			data['recipes'].append({'name': r['title'], 'id': str(r['_id'])})
			# print(data[-1])
		
		return render_template('recipes.html', data = data)
		
	@app.route('/recipe/<id>', methods=['GET'])
	def Recipe(id):
		recipe = db.recipes.find_one({'owner': session['id'], '_id': ObjectId(id)})
		recipe['id'] = id
		
		if recipe == None:
			return '404: Recipe['+id+'] not found'
		
		return render_template('recipe.html', data = {'recipe': recipe})

	@app.route('/submit_recipe', methods=['POST'])
	def SubmitRecipe():
		success = False
		
		result = DotMap(request.get_json())
		recipe = {
			'title': result.title,
			'body': ParseRecipe(result),
			'owner': ObjectId(result.owner),
			'url': result.url
			}
		print(recipe)
		db.recipes.insert_one(recipe)
		
		return "return"
		
	@app.route('/delete_recipe/<id>', methods=['GET'])
	def DeleteRecipe(id):
		write_concern = db.recipes.remove({'owner': session['id'], '_id': ObjectId(id)})		
		return redirect(url_for('RecipeBook'))
		
	@app.route('/edit_recipe/<id>', methods=['GET', 'POST'])
	def EditRecipe(id):
		if request.method == 'GET':
			recipe = db.recipes.find_one({'owner': session['id'], '_id': ObjectId(id)})
			return render_template('edit_recipe.html', data = {'recipe': recipe})
			
		else:
			#request.method == 'POST'
			# print(request.form['title'])
			db.recipes.update(
				{'owner': session['id'], '_id': ObjectId(id)},
				{
					'$set':{
						'title': request.form['title'],
						'body': '\n'+request.form['body']
					}
				}
			)
				
			return redirect(url_for('Recipe', id = id))