import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tmpImagesDir = join(__dirname, "..", "..", "uploads", "tmp", "images");
const imagesDir = join(__dirname, "..", "..", "uploads", "images");

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

async function saveToTemp(imagePath, originalFilename) {
	ensureDir(tmpImagesDir);

	const fileId = uuidv4();
	const ext = originalFilename.substring(originalFilename.lastIndexOf("."));
	const imageFilename = fileId + ext;
	const imageDestPath = join(tmpImagesDir, imageFilename);

	fs.copyFileSync(imagePath, imageDestPath);

	return {
		fileId,
		imageUrl: "/uploads/tmp/images/" + imageFilename,
		ext,
	};
}

async function moveFromTmpToPermanent(fileId, originalExt) {
	ensureDir(imagesDir);

	const tmpImagePath = join(tmpImagesDir, fileId + originalExt);

	if (fs.existsSync(tmpImagePath)) {
		const permanentImageName = fileId + originalExt;
		const permanentImagePath = join(imagesDir, permanentImageName);
		fs.copyFileSync(tmpImagePath, permanentImagePath);
		fs.unlinkSync(tmpImagePath);
		return { imageUrl: "/uploads/images/" + permanentImageName };
	}

	return { imageUrl: "/uploads/tmp/images/" + fileId + originalExt };
}

function cleanupTmpDir() {
	const now = new Date();
	const logPrefix = `[${now.toISOString()}] 临时文件清理:`;

	let cleanedCount = 0;
	const errors = [];

	if (fs.existsSync(tmpImagesDir)) {
		const files = fs.readdirSync(tmpImagesDir);
		for (const file of files) {
			try {
				const filePath = join(tmpImagesDir, file);
				fs.unlinkSync(filePath);
				cleanedCount++;
			} catch (error) {
				errors.push(`${file}: ${error.message}`);
			}
		}
	}

	const logMessage = `${logPrefix} 清理了 ${cleanedCount} 个文件`;
	if (errors.length > 0) {
		console.warn(`${logPrefix} 清理完成，但有 ${errors.length} 个错误:`, errors);
	} else if (cleanedCount > 0) {
		console.log(logMessage);
	}
}

export { saveToTemp, moveFromTmpToPermanent, cleanupTmpDir };