import fs from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let potrace = null;
try {
	const potraceModule = await import("potrace");
	potrace = potraceModule;
} catch (e) {
	console.warn("potrace 未安装，图片矢量化功能将不可用");
}

const tmpImagesDir = join(__dirname, "..", "..", "uploads", "tmp", "images");
const tmpVectorsDir = join(__dirname, "..", "..", "uploads", "tmp", "vectors");
const imagesDir = join(__dirname, "..", "..", "uploads", "images");
const vectorsDir = join(__dirname, "..", "..", "uploads", "vectors");

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

async function vectorizeAndSaveTemp(imagePath, originalFilename) {
	ensureDir(tmpImagesDir);
	ensureDir(tmpVectorsDir);

	const fileId = uuidv4();
	const ext = originalFilename.substring(originalFilename.lastIndexOf("."));
	const imageFilename = fileId + ext;
	const imageDestPath = join(tmpImagesDir, imageFilename);

	fs.copyFileSync(imagePath, imageDestPath);

	let vectorUrl = null;
	if (potrace) {
		try {
			const svg = await new Promise((resolve, reject) => {
				potrace.trace(imageDestPath, (err, svg) => {
					if (err) reject(err);
					else resolve(svg);
				});
			});
			const svgFilename = fileId + ".svg";
			const svgDestPath = join(tmpVectorsDir, svgFilename);
			fs.writeFileSync(svgDestPath, svg);
			vectorUrl = "/uploads/tmp/vectors/" + svgFilename;
		} catch (error) {
			console.error("矢量化失败:", imageFilename, error.message);
		}
	}

	return {
		fileId,
		imageUrl: "/uploads/tmp/images/" + imageFilename,
		vectorUrl,
	};
}

async function moveFromTmpToPermanent(fileId, originalExt) {
	ensureDir(imagesDir);
	ensureDir(vectorsDir);

	const tmpImagePath = join(tmpImagesDir, fileId + originalExt);
	const permanentImageName = fileId + originalExt;
	const permanentImagePath = join(imagesDir, permanentImageName);
	const imageUrl = "/uploads/images/" + permanentImageName;

	let vectorUrl = null;

	if (fs.existsSync(tmpImagePath)) {
		fs.copyFileSync(tmpImagePath, permanentImagePath);
		fs.unlinkSync(tmpImagePath);
	}

	const tmpSvgPath = join(tmpVectorsDir, fileId + ".svg");
	if (fs.existsSync(tmpSvgPath)) {
		const permanentSvgName = fileId + ".svg";
		const permanentSvgPath = join(vectorsDir, permanentSvgName);
		fs.copyFileSync(tmpSvgPath, permanentSvgPath);
		fs.unlinkSync(tmpSvgPath);
		vectorUrl = "/uploads/vectors/" + permanentSvgName;
	}

	return { imageUrl, vectorUrl };
}

function cleanupTmpDir() {
	const now = new Date();
	const logPrefix = `[${now.toISOString()}] 临时文件清理:`;

	let cleanedCount = 0;
	const errors = [];

	for (const dir of [tmpImagesDir, tmpVectorsDir]) {
		if (!fs.existsSync(dir)) continue;

		const files = fs.readdirSync(dir);
		for (const file of files) {
			try {
				const filePath = join(dir, file);
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

export { vectorizeAndSaveTemp, moveFromTmpToPermanent, cleanupTmpDir };
