import taskRepository from '../repositories/taskRepository.js';

export const updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, description, completed, comments } = req.body;

        const task = await taskRepository.findOne({ "subtasks._id": subtaskId });
        if (!task) return res.status(404).json({ status: 'error', message: 'Subtask not found' });

        const subtask = task.subtasks.id(subtaskId);
        if (title !== undefined) subtask.title = title;
        if (description !== undefined) subtask.description = description;
        if (completed !== undefined) subtask.completed = completed;
        if (comments !== undefined) subtask.comments = comments; // Assuming comments might be added to subtasks schema later if needed

        await taskRepository.save(task);

        res.status(200).json({ status: 'success', data: { subtask } });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;

        const task = await taskRepository.findOne({ "subtasks._id": subtaskId });
        if (!task) return res.status(404).json({ status: 'error', message: 'Subtask not found' });

        task.subtasks.pull(subtaskId);
        await taskRepository.save(task);

        res.status(200).json({ status: 'success', message: 'Subtask deleted successfully' });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
