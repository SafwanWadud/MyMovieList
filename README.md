# MyMovieList

## 1. Database setup

  1.1 Open terminal and navigate to the directory containing all the source code and resources
  1.2 If a folder named “database” is not there, create one
  1.3 Start up the mongo daemon by entering the command: **mongod --dbpath=”/path-to-database-folder-from-step-1.1.2”**

## 2. Database initialization

  2.1 Open another terminal window and avigate to the directory containing all the source code and resources
  2.2 Initialize the database by entering the command: **node db_init_script.js**
      Note: this might take a few minutes

## 3. Instructions to run server
  3.1 In the same terminal window as used in step 1.2, enter the command: **node server_db.js**
  3.2 Incase of server crash: repeat steps 2.2 - 3.1 
