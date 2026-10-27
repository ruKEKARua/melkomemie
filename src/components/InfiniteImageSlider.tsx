import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Navigation } from "swiper/modules";
import type { RootState } from "../store/store";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import useMovieImages from "../HooksTMDB/useMovieImages";
import "swiper/css";
import "swiper/css/navigation";
import Button from "./UI/Button";
import { getMovieImageUrl } from "../api/tmdbImage";
import type { MovieSource } from "../api/movieSource";

type InfiniteSliderProps = {
  movie_ID: number;
    source?: MovieSource;
};

type MovieImagesType = "posters" | "backdrops" | "logos";

export default function InfiniteSlider({movie_ID, source = 'tmdb'}:InfiniteSliderProps) {

    const isModalOpen = useSelector((state: RootState) => state.openModal.value)
    const [postersType, setPostersType] = useState<MovieImagesType>('posters');
    const isBackdrop = postersType === "backdrops";

    const movieImages = useMovieImages({
        movie_id: movie_ID,
        postersType,
        source,
    });

    const posterSize:string = 'w780';
    const backdropsURLs = movieImages.slice(0,21).map((image) => {
        return getMovieImageUrl(image.file_path, posterSize);
    })

    useEffect(() => {



    }, [postersType])

    return (
        <div
          className={`${
            isBackdrop ? "w-130 h-100" : "w-130 h-170"
          } rounded-2xl overflow-hidden bg-white dark:bg-slate-900`}
        >
            <Swiper
                modules={[Navigation, FreeMode, Mousewheel]}
                slidesPerView={1}
                slidesPerGroup={1}
                spaceBetween={20}
                navigation={{enabled:true, nextEl:'.nextButton2', prevEl:'.prevButton2'}}
                rewind={true}
                mousewheel={true}

                direction={isBackdrop ? 'horizontal' : 'vertical'}
                enabled={isModalOpen}

                freeMode={{momentum:false, enabled:true}}

                grabCursor={true}
                className={`flex justify-center items-center w-full h-${postersType === 'backdrops' ? 'full' : '170'} animate-fade`}
                key={postersType}
            >

                {
                    backdropsURLs.map((poster, index) => {

                        return(
                        
                            <SwiperSlide key={index}>
                            
                                <div className="size-full">
                                    <img src={poster} loading="lazy" decoding="async"
                                    className={`
                                        w-full h-full m-auto object-cover
                                    `} />
                                </div>

                            </SwiperSlide>
                        )
                    })
                }

            </Swiper>

                
            <div className="absolute top-0 flex justify-between flex-col gap-20 w-full h-full">
                <div className="text-white text-xl flex justify-center items-center gap-10 absolute -top-10 left-15 w-100">
                    <Button className={
                        `${ postersType === 'logos' ? 'text-emerald-600 hover:text-emerald-600 scale-110' : 'scale-90'}
                            hover:underline transition delay-100 
                            hover:text-emerald-300`
                        } 
                        label="Лого" onClick={() => setPostersType("logos")}/>
                    <Button className={
                        `${ postersType === 'backdrops' ? 'text-emerald-600 hover:text-emerald-600 scale-110' : 'scale-90'}
                            hover:underline transition delay-100 
                            hover:text-emerald-300`
                        } 
                        label="Кадры фильма" onClick={() => setPostersType("backdrops")}/>
                    <Button className={
                        `${ postersType === 'posters' ? 'text-emerald-600 hover:text-emerald-600 scale-120' : 'scale-90'}
                            hover:underline transition delay-100 
                            hover:text-emerald-300`
                        } 
                        label="Постеры" onClick={() => setPostersType("posters")}/>
                </div> 
                <div
                    className={` absolute z-10 flex justify-between items-center flex-col
                        ${isBackdrop ? 'w-20 h-50 rotate-270 left-50 top-90' 
                            : '-left-20 top-70 w-20 h-50'}
                    `}
                    >
                    <Button

                        children={
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5L15 12L8 19" 
                                    stroke="#61b28a" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    />
                            </svg>}
                        className="
                            rotate-270
                            rounded-full w-25 h-10 
                            flex justify-center items-center 
                            text-xl font-medium bg-blue-600 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 prevButton2"
                        />
                    <Button
                        children={
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5L15 12L8 19" 
                                    stroke="#61b28a" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    />
                            </svg>}
                        className="
                            rotate-90
                            rounded-full w-25 h-10 
                            flex justify-center items-center 
                            text-xl font-medium bg-blue-600 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 nextButton2"
                        />
                </div>
            </div>

        
        </div>
    );
}