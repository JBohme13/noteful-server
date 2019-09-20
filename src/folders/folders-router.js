const express = require('express')
const foldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

foldersRouter
  .route('/')
  .get((req, res, next) => {
      const knexInstance = req.app.get('db')
      foldersService.getAllFolders(knexInstance)
        .then(folders => {
            res.json(folders)
        })
        .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name } = req.body
    const newFolder = { name }

    foldersService.insertFolder(
        req.app.get('db'),
        newFolder
    )
        .then(folder => {
            res
              .status(201)
              .json(folder)
        })
        .catch(next)
  })

foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
      foldersService.getById(
          req.app.get('db'),
          req.params.folder_id
      )
        .then(folder => {
            if(!folder) {
                return res.status(404).json({
                    error: { message: `Folder doesn't exist` }
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
  })
  .get((req, res, next) => {
      res.json(folder)
  })
  .delete((req, res, next) => {
      foldersService.deleteFolder(
          req.app.get('db'),
          req.params.folder_id
      )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
  })

module.exports = foldersRouter