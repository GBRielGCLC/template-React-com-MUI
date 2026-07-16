import { DarkMode, LightMode } from "@mui/icons-material";
import { Box, IconButton, useTheme } from "@mui/material";
import { useAppThemeContext } from "../../Contexts";

export const ToggleThemeButton = ({ ...props }) => {
    const { toggleTheme, themeName } = useAppThemeContext();
    const theme = useTheme();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        document.documentElement.style.setProperty('--toggle-x', x + 'px');
        document.documentElement.style.setProperty('--toggle-y', y + 'px');
        toggleTheme();
    };

    return (
        <IconButton onClick={handleClick} color="inherit" {...props}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.palette.primary.main,
                    transition:
                        "transform 0.8s ease, opacity 0.4s ease",
                    transform: `rotate(${themeName === "light" ? 0 : 360
                        }deg)`,
                    opacity: 1,
                }}
            >
                {themeName === "light" ? (
                    <DarkMode />
                ) : (
                    <LightMode />
                )}
            </Box>
        </IconButton>
    );
}
