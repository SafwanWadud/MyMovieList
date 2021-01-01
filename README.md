# MyMovieList

## 1. Database setup

  1. Open terminal and navigate to the directory containing all the source code and resources
  1. If a folder named “database” is not there, create one
  1. Start up the mongo daemon by entering the command: **mongod --dbpath=”/_path-to-database-folder-from-step-1.2_”**

## 2. Database initialization

  1. Open another terminal window and navigate to the directory containing all the source code and resources
  1. Initialize the database by entering the command: **node db_init_script.js**
     (Note: this might take a few minutes)

## 3. Instructions to run server
  1. In the same terminal window as used in step 2, enter the command: **node server_db.js**
  1. Incase of server crash: repeat steps 2.2 - 3.1 
