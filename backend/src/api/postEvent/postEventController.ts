import type { Request, RequestHandler, Response } from "express";
import multer from "multer";
import { postEventService } from "./postEventService";

const upload = multer({ dest: "uploads/" });

class PostEventController {
	public createPostEvent: RequestHandler = async (req: Request, res: Response) => {
		console.log("createPostEvent controller method called.");
		upload.single("photo")(req, res, async (err) => {
			if (err) {
				console.error("Multer error:", err);
				return res.status(500).send({ message: err.message });
			}

			console.log("req.body:", req.body);
			console.log("req.file:", req.file);

			if (!req.file) {
				console.error("No photo uploaded.");
				return res.status(400).send({ message: "No photo uploaded." });
			}

			const { comment, conclution, eventId } = req.body;
			const photoUrl = req.file.path; // Path where the file is stored

			console.log("Calling postEventService.create with:", { comment, conclution, eventId, photoUrl });
			const serviceResponse = await postEventService.create(
				{ comment, conclution, eventId: Number(eventId) },
				photoUrl,
			);

			res.status(serviceResponse.statusCode).send(serviceResponse);
		});
	};
}

export const postEventController = new PostEventController();
