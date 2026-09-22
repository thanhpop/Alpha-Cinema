import instance from '@/config/axios';
import type { Movie } from '@/types/Movie';

function normalizeGenres(m: any): string[] {
    if (!m) return [];
    if (Array.isArray(m.genres)) return m.genres.map((g: any) => (typeof g === 'string' ? g : g?.name)).filter(Boolean);
    return [];
}

function toMovie(m: any): Movie {
    return {
        id: Number(m.id),
        title: m.title,
        overview: m.overview,
        genres: normalizeGenres(m),
        duration: typeof m.duration === 'number' ? m.duration : (Number(m.duration) || 0),
        language: m.language ?? m.originalLanguage ?? m.original_language,
        releaseDate: m.releaseDate ?? undefined,
        releaseDateIso: m.releaseDateIso ?? undefined,
        endDate: m.endDate ?? undefined,
        endDateIso: m.endDateIso ?? undefined,
        poster: m.poster ?? m.poster_path,
        imdbId: m.imdbId ?? undefined,
        filmId: m.filmId ?? undefined,
        trailer: m.trailer ?? undefined,
    };
}

export const movieService = {

    async getMovies(title?: string): Promise<Movie[]> {
        const params = title ? { title } : undefined;
        const res = await instance.get('/movie', { params },);
        const list = res.data.data;
        return list.map(toMovie);
    },
    async getMovieById(id: number) {
        const res = await instance.get(`/movie/${id}`);
        return toMovie(res.data.data);
    },

    async createMovie(payload: Omit<Movie, 'id'>): Promise<Movie> {
        const res = await instance.post('/movie', payload);
        const movie = res.data.data;
        return toMovie(movie);
    },

    async updateMovie(id: number, payload: Omit<Movie, 'id'>): Promise<Movie> {
        const body = { ...payload, id: Number(id) };
        const res = await instance.put(`/movie/${encodeURIComponent(String(id))}`, body);
        const movie = res.data.data;
        return toMovie(movie);
    },

    async deleteMovie(id: number): Promise<void> {
        await instance.delete(`/movie/${encodeURIComponent(String(id))}`);
    },
};

export default movieService;
