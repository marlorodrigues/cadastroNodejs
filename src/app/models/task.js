const mongoose = require('../../database/index');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        require: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    completed: {
        type: Boolean,
        require: true,
        default: false
    },
    createAt: {
        type: Date,
        default: Date.now
    }
});

const Tasks = mongoose.model('Task', taskSchema);

module.exports = Tasks;
