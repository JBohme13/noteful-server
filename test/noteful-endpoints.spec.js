const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray, makeFoldersArray, makeMaliciosNote } = require('./noteful-fixtures')

describe('Noteful endpoints', function() {
    let db
    
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

    this.afterEach('cleanup', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

    describe(`GET /api/folders`, () => {
        context('Given no folders', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })

        context('Given folders in db', () => {
            const testFolders = makeFoldersArray();

            beforeEach('insert folders', () => {
                return db
                  .into('folders')
                  .insert(testfolders)
            })

            it(`responds with 200 and all of the folders`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
    })

    describe(`GET /api/notes`, () => {
        context(`Given no notes`, () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, [])
            })
        })

        context(`Given notes in db`, () => {
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it(`responds with 200 and all notes`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, testNotes)
            })
        })

        context(`Given an XSS attack note`, () => {
            const testNotes = makeNotesArray();
            const { maliciosNote, expectedNote } = makeMaliciosNote();

            beforeEach('insert malicios note', () => {
                return db
                   ,into('notes')
                   .insert(testNotes)
                   .then(() => {
                       return db
                           .into('notes')
                           .insert([maliciosNote])
                   })
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/notes`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedNote.name)
                        expect(res.body[0].content).to.eql(expectedNote.content)
                    })
            })
        })
    })

    describe(`GET /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it('responds with 404', () => {
                const folderId = 12345
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })
        })

        context(`Given folders in db`, () => {
            const testFolders = makeFoldersArray();

            beforeEach('insert folders', () => {
                return db
                   .into('folders')
                   .insert(testFolders)
            })

            it('responds with 200 and specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId -1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })
    })

    describe(`GET /api/notes/:note_id`, () => {
        context(`Given no articles`, () => {
            it('responds with 404', () => {
                const noteId = 12345
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })

        context('Given notes in db', () => {
            const testNotes = makeNotesArray();

            beforeEach('insert Notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it(`responds with 200 and specified note`, () => {
                const noteId = 2
                const expectedNote = testNotes[noteId -1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })
        })

        context(`Given an XSS attack note`, () => {
            const testNotes = makeNotesArray();
            const { maliciosNote, expectedNote } = makeMaliciosNote();

            beforeEach('insert malicios note', () => {
                return db
                    .into(notes)
                    .insert(testNotes)
                    .then(() => {
                        return db
                          .into(notes)
                          .insert([maliciosNote])
                    })
            })

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/notes/${maliciosNote.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedNote.name)
                        expect(res.body.content).to.eql(expectedNote.content)
                    })
            })
        })
    })

    describe(`POST /api/folders`, () => {
        const testFolders = makeFoldersArray();

        beforeEach('insert folders', () => {
            return db
              .into('folders')
              .insert(testFolders)
        })

        it(`creates a folder, responding with 201 and new folder`, () => {
            const newFolder = {
                name: 'test Folder'
            }

            return superTest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res.body.name).to.eql(newFolder.name)
                .then(res => {
                    supertest(app)
                      .get(`/api/folders/${res.body.id}`)
                      .expect(res.body)
                })
        })
    })

    describe(`POST /api/notes`, () => {
        const testNotes = makeNotesArray();
        
        beforeEach('insert notes', () => {
             return db
                 .into('notes')
                 .insert(testNotes)
        })

        it(`creates a note, responding with 201 and new note`, () => {
            const newNote = {
                name: 'test note',
                modified: '2019-01-03T00:00:00.000Z',
                folderId: '2',
                content: 'test content'
            }

            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newNote.name)
                    expect(res.body.modified).to.eql(newNote.modified)
                    expect(res.body.folderId).to.eql(newNote.folderId)
                    expect(res.body.content).to.eql(newNote.content)
                })
        })

        it('resmoves XSS attack content', () => {
            const { maliciosNote, expectedNote } = makeMaliciosNote();

            return supertest(app)
                .post('/api/notes')
                .send(maliciosNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(expectedNote.name)
                    expect(res.body.content).to.eql(expectedNote.content)
                })
        })
    })

    describe(`DELETE /api/folders`, () => {
        
    })
})
