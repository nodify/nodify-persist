# Makefile

MODULES = connect nodify-approute node-props node-mug underscore mysql
BOOTSTRAP = https://github.com/twitter/bootstrap/archive/v2.0.4.zip 
BOOTSTRAP_DIR = bootstrap-2.0.4

default : ./node_modules bootstrap static/js/underscore-min.js static/js/backbone-min.js static/js/handlebars-1.0.0.beta.6.js

clean : 
	rm -rf ./node_modules
	rm -rf static/bootstrap
	rm -f bootstrap.zip
	rm -rf $(BOOTSTRAP_DIR)
	rm -f static/js/underscore-min.js
	rm -f static/js/backbone-min.js
	rm -f static/js/handlebars-1.0.0.beta.6.js

bootstrap: bootstrap.zip
	unzip bootstrap.zip
	(cd $(BOOTSTRAP_DIR); make; mv docs/assets ../static/bootstrap)

bootstrap.zip:
	wget -O bootstrap.zip $(BOOTSTRAP)

./node_modules :
	mkdir ./node_modules
	npm install $(MODULES)

static/js/underscore-min.js :
	wget -O static/js/underscore-min.js http://documentcloud.github.com/underscore/underscore-min.js

static/js/backbone-min.js :
	wget -O static/js/backbone-min.js http://documentcloud.github.com/backbone/backbone-min.js

static/js/handlebars-1.0.0.beta.6.js :
	wget -O static/js/handlebars-1.0.0.beta.6.js https://github.com/downloads/wycats/handlebars.js/handlebars-1.0.0.beta.6.js
