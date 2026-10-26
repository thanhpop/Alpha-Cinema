export type AgeRating = "P" | "K" | "T13" | "T16" | "T18";

export interface Movie {
    id: number;
    title: string;
    overview?: string;
    genres: string[];
    duration: number;
    language?: string;
    releaseDate?: string;
    releaseDateIso?: string;
    poster?: string;
    endDate?: string;
    endDateIso?: string;
    ageRating?: AgeRating;
    imdbId?: string;
    filmId?: string;
    trailer?: string;
}

export interface ShowingMovie extends Movie {
    hasShowtimes: boolean;
}

export interface ApiMovie {
    id: number;
    Title: string;
    Year: string;
    Genre: string;
    imdbID?: string;
    Poster?: string;
}
