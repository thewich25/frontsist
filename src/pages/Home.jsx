const Home = () => {
    return (
        <div className="min-vh-100">
            {/* Hero Section */}
            <section className="bg-primary text-white py-5">
                <div className="container">
                    <div className="row align-items-center min-vh-75">
                        <div className="col-lg-12 text-center">
                            <h1 className="display-4 fw-bold mb-4">
                                COSSMIL
                            </h1>
                            <p className="lead mb-4">
                                Sistema de gestión en desarrollo
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-5">
                <div className="container">
                    <div className="row justify-content-center text-center">
                        <div className="col-lg-8">
                            <h2 className="display-6 fw-bold mb-4">Proyecto en Construcción</h2>
                            <p className="lead text-muted mb-4">
                                La aplicación está siendo desarrollada con React + Vite y Node.js + Express
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;