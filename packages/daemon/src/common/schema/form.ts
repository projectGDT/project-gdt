import { z } from 'zod';

export const zApplyForm = z.object({
    title: z.string().min(1).max(30),
    preface: z.string().max(300).optional(),
    questions: z.array(z.object({
        content: z.string().min(1).max(60),
        hint: z.string().max(300).optional(),
        required: z.boolean(),
        branch: z.union([
            z.object({
                type: z.literal('choice'),
                choices: z.array(z.string().min(1).max(30)).min(2).max(10),
                allowMultiple: z.boolean(),
                allowCustom: z.boolean(),
            }),
            z.object({
                type: z.literal('number'),
                min: z.onumber(),
                max: z.onumber(),
                integer: z.boolean(),
            }),
            z.object({
                type: z.literal('text'),
                allowMultiLine: z.boolean(),
            }),
        ]),
    })).min(1).max(30),
});
export type ApplyForm = z.infer<typeof zApplyForm>;

export const zGeneralAnswer = z.array(z.union([
    z.object({
        choices: z.array(z.number().int().min(0).max(9)).min(1).max(10),
        custom: z.string().min(1).max(30).optional(),
    }),
    z.number(),
    z.null(),
    z.string().max(300),
])).min(1).max(30);
export type GeneralAnswer = z.infer<typeof zGeneralAnswer>;

export function validateAnswer(questions: ApplyForm['questions'], answers: GeneralAnswer) {
    if (answers.length !== questions.length) {
        return false;
    }
    for (let i = 0; i < answers.length; i++) {
        const { required, branch } = questions[i];
        const answer = answers[i];
        if (branch.type === 'choice') {
            if (typeof answer !== 'object' || answer === null) {
                return false;
            }
            if (!branch.allowCustom && answer.custom) {
                return false;
            }
            if (required && !answer.choices.length && !answer.custom) {
                return false;
            }
            if (answer.choices.some(c => c < 0 || c >= branch.choices.length)) {
                return false;
            }
            if (!branch.allowMultiple) {
                if (answer.choices.length > 1) {
                    return false;
                }
            } else {
                if (new Set(answer.choices).size !== answer.choices.length) {
                    return false;
                }
            }
        } else if (branch.type === 'number') {
            if (answer === null) {
                if (required) {
                    return false;
                } else {
                    continue;
                }
            }
            if (typeof answer !== 'number') {
                return false;
            }
            if (branch.integer && !Number.isInteger(answer)) {
                return false;
            }
            if (branch.max && answer > branch.max) {
                return false;
            }
            if (branch.min && answer < branch.min) {
                return false;
            }
        } else if (branch.type === 'text') {
            if (typeof answer !== 'string') {
                return false;
            }
            if (required && !answer.length) {
                return false;
            }
            if (branch.allowMultiLine) {
                if (answer.length > 300) {
                    return false;
                }
            } else {
                if (answer.includes('\n') || answer.length > 60) {
                    return false;
                }
            }
        }
    }
    return true;
}