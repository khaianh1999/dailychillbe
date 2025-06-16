// controllers/commentController.js
const Comment = require('../models/commentModel');
const fs = require('fs'); // To handle file deletion

class CommentController {
    /**
     * Creates a new comment.
     * (POST /api/comments)
     */
    async createComment(req, res) {
        try {
            const { content, parent_id, user_id, article_id, updated_by } = req.body;
            let image_url = null;

            if (req.file) {
                image_url = req.file.path; // Path to the image file saved by Multer
            }

            // user_id should ideally come from authenticated user info (e.g., JWT)
            // For simplicity, assuming it's sent from client or a fixed value for now.
            if (!user_id) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting image file after error: user_id missing', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'user_id is required to create a comment.' });
            }
            if (!article_id) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting image file after error: article_id missing', unlinkErr);
                    });
                }
                return res.status(400).json({ message: 'article_id is required to create a comment.' });
            }

            const commentData = {
                content,
                image_url,
                parent_id: parent_id ? parseInt(parent_id) : null, // Convert to integer, or null
                user_id: parseInt(user_id),
                article_id: parseInt(article_id), // Parse article_id
                updated_by: updated_by ? parseInt(updated_by) : parseInt(user_id) // Default updated_by to user_id if not provided
            };

            const newComment = await Comment.createComment(commentData);
            res.status(201).json({ message: 'Comment created successfully', data: newComment });
        } catch (err) {
            // If a database error occurs, delete the uploaded file
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting image file after DB error (createComment):', unlinkErr);
                });
            }
            console.error('Error creating comment:', err);
            res.status(500).json({ message: 'Error creating comment', error: err.message });
        }
    }

    /**
     * Retrieves a list of all comments.
     * (GET /api/comments)
     * Can add query params to filter by parent_id or article_id: /api/comments?article_id=123&parent_id=456
     */
    async getComments(req, res) {
        try {
            const filters = {};
            if (req.query.parent_id) {
                filters.parent_id = parseInt(req.query.parent_id);
            }
            if (req.query.article_id) { // Add filter for article_id
                filters.article_id = parseInt(req.query.article_id);
            }
            const comments = await Comment.getComments(filters);
            res.status(200).json({ message: 'Comments retrieved successfully', data: comments });
        } catch (err) {
            console.error('Error retrieving comments:', err);
            res.status(500).json({ message: 'Error retrieving comments', error: err.message });
        }
    }

    /**
     * Retrieves a comment by ID.
     * (GET /api/comments/:id)
     */
    async getCommentById(req, res) {
        try {
            const { id } = req.params;
            const comment = await Comment.getCommentById(parseInt(id));
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }
            res.status(200).json({ message: 'Comment retrieved successfully', data: comment });
        } catch (err) {
            console.error('Error retrieving comment by ID:', err);
            res.status(500).json({ message: 'Error retrieving comment by ID', error: err.message });
        }
    }

    /**
     * Updates a comment.
     * (PUT /api/comments/:id)
     */
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            // user_id and article_id should ideally not be changed after creation
            const { content, parent_id, updated_by } = req.body;
            
            // 1. Get current comment information to handle old image path
            const existingComment = await Comment.getCommentById(parseInt(id));
            if (!existingComment) {
                // If comment not found, delete the newly uploaded file (if any)
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting unused image file (updateComment):', unlinkErr);
                    });
                }
                return res.status(404).json({ message: 'Comment not found for update' });
            }

            let new_image_url_to_save = existingComment.image_url; // Default to keep old image

            // 2. Process new image file (if any) or request to remove old image
            if (req.file) {
                // New image file uploaded
                new_image_url_to_save = req.file.path;

                // Delete old image if it exists and is not a default/placeholder
                if (existingComment.image_url && fs.existsSync(existingComment.image_url)) {
                    fs.unlink(existingComment.image_url, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting old image file (updateComment):', unlinkErr);
                    });
                }
            } else if (req.body.remove_image === 'true' || (req.body.image_url !== undefined && req.body.image_url === '')) {
                // No new file, but client requested to remove current image or sent empty image_url
                new_image_url_to_save = null; // Set to NULL in DB

                // Delete old image if it exists
                if (existingComment.image_url && fs.existsSync(existingComment.image_url)) {
                    fs.unlink(existingComment.image_url, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting old image file (remove request updateComment):', unlinkErr);
                    });
                }
            }
            // If no req.file and no remove request, new_image_url_to_save remains existingComment.image_url

            // 3. Prepare data to send to model
            const commentData = {
                content,
                image_url: new_image_url_to_save,
                parent_id: parent_id ? parseInt(parent_id) : null,
                user_id: parseInt(existingComment.user_id), // User_id (creator) does not change
                article_id: parseInt(existingComment.article_id), // Article_id does not change
                updated_by: updated_by ? parseInt(updated_by) : parseInt(existingComment.user_id) // updated_by is typically the user performing the update
            };
            
            const updatedComment = await Comment.updateComment(parseInt(id), commentData);
            if (!updatedComment) {
                return res.status(404).json({ message: 'Comment not found for update' });
            }
            res.status(200).json({ message: 'Comment updated successfully', data: updatedComment });
        } catch (err) {
            // If a database error occurs, delete the newly uploaded file (if any)
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting new image file after DB error (updateComment):', unlinkErr);
                });
            }
            console.error('Error updating comment:', err);
            res.status(500).json({ message: 'Error updating comment', error: err.message });
        }
    }

    /**
     * Soft deletes a comment.
     * (DELETE /api/comments/:id)
     */
    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const success = await Comment.deleteComment(parseInt(id));
            if (!success) {
                return res.status(404).json({ message: 'Comment not found for deletion' });
            }
            res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (err) {
            console.error('Error deleting comment:', err);
            res.status(500).json({ message: 'Error deleting comment', error: err.message });
        }
    }
}

module.exports = new CommentController();
