import config from '../config/config';

const UI_AVATARS_URL = 'https://ui-avatars.com/api/';

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const isBlobUrl = (value) => /^blob:/i.test(value);
const isDefaultImage = (value) => !value || value === 'default.png' || value === '/default.png';

export const appendImageVersion = (url, version) => {
    if (!url || isBlobUrl(url) || !version) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(version)}`;
};

export const getInitialAvatarUrl = (username) => {
    const name = encodeURIComponent((username || 'User').trim() || 'User');
    return `${UI_AVATARS_URL}?name=${name}&background=4F46E5&color=fff&bold=true`;
};

const toImageUrl = (value) => {
    if (isBlobUrl(value) || isAbsoluteUrl(value)) return value;
    return `${config.API_URL}/${value.replace(/^\/+/, '')}`;
};

export const getUploadUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return '';
    return toImageUrl(value.trim());
};

export const getAvatarUrl = (avatar, username, version) => {
    if (isDefaultImage(typeof avatar === 'string' ? avatar.trim() : '')) {
        return getInitialAvatarUrl(username);
    }
    return appendImageVersion(toImageUrl(avatar.trim()), version);
};

export const getCoverUrl = (coverImage, version) => {
    if (isDefaultImage(typeof coverImage === 'string' ? coverImage.trim() : '')) return '';
    return appendImageVersion(toImageUrl(coverImage.trim()), version);
};
