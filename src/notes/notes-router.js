const express = require('express')
const path = require('path')
const xss = require('xss')
const notesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNotes = note => ({
    id: note.id,
    name: xss(note.name),
    modified: note.modified,
    folderId: note.folder_id,
    content: xss(note.content)
})

notesRouter
  .route('/')
  .get((req, res, next) => {
      const knexInstance = req.app.get('db')
      notesService.getAllNotes(knexInstance)
        .then(notes => {
            res.json(notes.map(serializeNotes))
        })
        .catch(next)
  })
  .post(jsonParser, (req,res,next) => {
      const { name, modified, folderId, content } = req.body
      const newNote = { name, modified, folderId, content }
      console.log(newNote)

      for (const [key, value] of Object.entries(newNote)) {
        if (value == null) {
          return res.status(400).json({
              error: { message: `Missing '${key}' in request body` }
          })
        }
      }
  
      notesService.insertNote(
          req.app.get('db'),
          newNote
        )
        .then(note => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `${note.id}`))
              .json(serializeNotes(note))
        })
        .catch(next)
  })

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
      notesService.getById(
          req.app.get('db'),
          req.params.note_id
      )
        .then(note => {
            if (!note) {
                return res.status(404).json({
                    error: { message: `Note doesn't exist` }
                })
            }
            res.note = note
            next()
        })
        .catch(next)
  })
  .get((req, res, next) => {
      res.json(serializeNotes(res.note))
  })
  .delete((req, res, next) => {
      notesService.deleteNote(
          req.app.get('db'),
          req.params.note_id
      )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
  })

  module.exports = notesRouter