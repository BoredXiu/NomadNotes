import { AppError } from "../utils/AppError.js";

function getFieldLabel(fieldName) {
	const labels = {
		startDate: "开始日期",
		endDate: "结束日期",
		expenseDate: "消费日期",
		noteDate: "记录日期",
	};
	return labels[fieldName] || fieldName;
}

function validateEndAfterStart(startField = "startDate", endField = "endDate", allowEqual = true) {
	return (req, _res, next) => {
		const startValue = req.body[startField];
		const endValue = req.body[endField];

		if (startValue === undefined || endValue === undefined) {
			next();
			return;
		}

		const start = new Date(startValue);
		const end = new Date(endValue);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			next(new AppError("日期格式无效", 400));
			return;
		}

		const startLabel = getFieldLabel(startField);
		const endLabel = getFieldLabel(endField);

		if (allowEqual) {
			if (end < start) {
				next(new AppError(`${endLabel}不能早于${startLabel}`, 400));
				return;
			}
		} else {
			if (end <= start) {
				next(new AppError(`${endLabel}必须晚于${startLabel}`, 400));
				return;
			}
		}

		next();
	};
}

export { validateEndAfterStart };
