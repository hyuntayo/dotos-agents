import { createContext, useContext } from 'react'
export const ExperienceMotion = createContext(false)
export const useQuietMotion = () => useContext(ExperienceMotion)
