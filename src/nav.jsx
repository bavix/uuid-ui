import React from 'react';
import "@theme-toggles/react/css/Expand.css"
import { Expand } from "@theme-toggles/react"
import { Helmet, HelmetProvider } from 'react-helmet-async';

export default class NavComponent extends React.Component {
    /**
     * Constructor for the NavComponent.
     * It calls the constructor of the parent class.
     *
     * @param {Object} props - The properties passed to the component.
     */
    constructor(props) {
        // Call the parent class constructor with the passed props
        super(props);
    }

    /**
     * Render method for the NavComponent.
     * This method returns the navigation panel (<nav>) with a brand and a menu.
     * The brand contains a link to the homepage with an image.
     * The menu contains a single item with a link to the homepage.
     *
     * @returns {JSX.Element} The rendered NavComponent.
     */
    render() {
        // Initialize the state variable for the theme toggle
        const [isToggled, setToggle] = React.useState(
            JSON.parse(localStorage.getItem('theme')) || false
        );

        // Use effect hook to update the theme in the local storage when the theme toggle state changes
        React.useEffect(() => {
            localStorage.setItem('theme', JSON.stringify(isToggled));
        }, [isToggled]);

        return (
            <HelmetProvider>
                {/* Navigation panel */}
                <nav
                    className={isToggled ? "navbar is-dark" : "navbar is-light"}
                    role="navigation" 
                    aria-label="main navigation" 
                >
                    {/* Helmet to update the theme class in the html tag */}
                    <Helmet>
                        <html lang="en" 
                            className={isToggled ? "theme-dark" : "theme-light"} />
                    </Helmet>
                    <div className="container">
                        {/* Brand */}
                        <div className="navbar-brand">
                            {/* Link to homepage */}
                            <a className="navbar-item" href="./">
                                <img src="./android-chrome-192x192.png" /> {/* Image for brand */}
                            </a>
                        </div>
                        {/* Menu */}
                        <div className="navbar-menu">
                            <div className="navbar-start">
                                {/* Link to homepage */}
                                <a className="navbar-item" href="./">
                                    UUIDConv UI {/* Menu item */}
                                </a>
                            </div>

                            <div className="navbar-end">
                                {/* Theme toggle component */}
                                <Expand 
                                    className='navbar-item' 
                                    duration={750} 
                                    toggled={isToggled} 
                                    toggle={(value) => setToggle(value)}
                                />
                            </div>
                        </div>
                    </div>
                </nav>
            </HelmetProvider>
        );
    }
}
