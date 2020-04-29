const express = require('express');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();
const Project = require('../models/project');
const Task = require('../models/task');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate(['user', 'tasks']);

        return res.send({ projects });

    } catch (error) {
        return res.status(400).send({ error: "Erro loading project" });
    }
});

router.get('/:projectID', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectID).populate(['user', 'tasks']);

        return res.send({ project, user: req.userId });

    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: "Erro loading project" });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.create({ title, description, user: req.userId });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });

            await projectTask.save();
            project.tasks.push(projectTask);
        }));

        await project.save();
        return res.send({ project });

    } catch (error) {
        console.log(error);
        return res.status(400).send({ error: "Erro creating new project" });
    }
});

router.put('/:projectID', async (req, res) => {
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.findByIdAndUpdate(req.params.projectID, { $set: { title, description } }, { new: true });

        // project.tasks = [];
        console.log(req.params.projectID);
        await Task.remove({ project: req.params.projectID });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: req.params.projectID });

            await projectTask.save();
            project.tasks.push(projectTask);
        }));

        await project.save();
        return res.send();

    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: "Erro updating project" });
    }
});

router.delete('/:projectID', async (req, res) => {
    try {
        await Project.findByIdAndRemove(req.params.projectID);

        return res.send();

    } catch (error) {
        return res.status(400).send({ error: "Erro deleting project" });
    }
});

module.exports = app => app.use('/projects', router);
