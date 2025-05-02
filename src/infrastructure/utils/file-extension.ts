import path from "path";


export const getFileExtension = (file: string) => {


  return path.extname(file).slice(1);

}