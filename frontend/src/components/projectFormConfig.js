// projectFormConfig.js

import Dayjs from 'dayjs';
import * as yup from 'yup';

export const STATUS_OPTIONS = [
    { id: '', name: 'None' },
    { id: 'Open', name: 'Open' },
    { id: 'In progress', name: 'In progress' },
    { id: 'Completed', name: 'Completed' },
    // If Edit uses "Done" instead, either standardize or add it here:
    // { id: "Done", name: "Done" },
];

export const DEFAULT_VALUES = {
    name: '',
    comments: '',
    status: '',
    projectmanager: '',
    employees: [],
    start_date: '',
    end_date: '',
};

export const PROJECT_SCHEMA = yup.object({
    name: yup.string().required('Name is a required field'),
    projectmanager: yup.string().required('Project manager is a required field'),
    status: yup.string().required('Status is a required field'),
    employees: yup.array().min(1, 'Pick at least one option from the select field'),
    comments: yup.string(),
    start_date: yup.date().required('Start date is a required field'),
    end_date: yup
        .date()
        .required('End date is a required field')
        .min(yup.ref('start_date'), 'The end date can not be before the start date'),
});

export function projectToFormValues(p) {
    const pm = p?.projectmanager ?? '';
    const emps = p?.employees ?? [];

    const normalizedEmployees = emps.map((e) => String(e?.id ?? e)).filter(Boolean);

    return {
        name: p?.name ?? '',
        comments: p?.comments ?? '',
        status: p?.status ?? '',
        projectmanager: String(pm),
        employees: normalizedEmployees,
        start_date: p?.start_date ? Dayjs(p.start_date).format('YYYY-MM-DD') : '',
        end_date: p?.end_date ? Dayjs(p.end_date).format('YYYY-MM-DD') : '',
    };
}

export function formToPayload(data) {
    const start = data?.start_date ? Dayjs(data.start_date).format('YYYY-MM-DD') : null;
    const end = data?.end_date ? Dayjs(data.end_date).format('YYYY-MM-DD') : null;

    return {
        name: data?.name ?? '',
        projectmanager: Number(data?.projectmanager),
        employees: (data?.employees ?? []).map(Number),
        status: data?.status ?? '',
        comments: data?.comments ?? '',
        start_date: start,
        end_date: end,
    };
}
