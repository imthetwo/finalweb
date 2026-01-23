import { createTheme } from "@mui/material"
import {red} from "@mui/material/colors"  

const theme = createTheme({
  palette:{
    primary:'#556cd6',
  },
  secodary:{
    main: '#f50057'
  },
  error:{
    main: red.A400
  }                 
})

export default theme