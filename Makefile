# Makefile

MODULES = underscore nodify-logger

default : ./node_modules

clean : 
	rm -rf ./node_modules

./node_modules :
	mkdir ./node_modules
	npm install $(MODULES)
