'use client'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion";
import "../styles/landing.css"
import Image from "next/image"
import book from "../assets/book.png"
import background from "../assets/background7.jpg";

const Landing = () => {
    const router = useRouter()

    return(
        <main>
            <div style={{
                backgroundImage: `url(${background.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.9
                }} className="box1 min-h-screen" id="home">
                <Image src={book} alt="Logo" width={200} height={200} priority id="book" className="animated-text w-48 h-auto"/>
                <p id="heading" className="animated-text">Score with Confidence</p>
                <p className="subheading animated-text">Turn confusion into clarity with organized exam-ready notes. Clarity for every topic.</p>
                <p className="subheading animated-text">No more wasted study time.</p>
                <button id="getstarted" className="animated-text" onClick={() => router.push('/signup')}> Get started </button>
                <p id="bottomtext">STUDY WITH NEXSTUDY</p>
            </div>
            <div className="box2" id="how-it-works">
                <div style={{overflow:"hidden"}} className="working">
                <motion.h1
                initial={{y:"100%"}}
                whileInView={{y:0}}
                viewport={{once:true}}
                transition={{duration:0.8}}
                >
                How does NexStudy work?
                </motion.h1>
                </div>
                <motion.div 
                initial={{ opacity:0, y:50 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.6 }}
                className='boxof2 box1of2'>
                    <div className="cardbox1">
                        <p id="bran">BRANCH</p>
                        <button className='demo'>Select your branch...      </button>
                        <p id="space1">SEMESTER</p>
                        <button className='demo'>Select your semester...      </button>
                    </div>
                    <div className="cardbox2">
                        <h4 className="top" style={{color: "#226801"}}>Choose your branch & semester</h4>
                        <p className='rest'>Access study material tailored to your curriculum.</p>
                    </div>
                </motion.div>
                <motion.div 
                initial={{ opacity:0, y:50 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.6 }}
                className='boxof2 box2of2'>
                    <div className="cardbox3" >
                        <h4 className="top" style={{color: "#131bb3"}}>Learn Through Structured Paths</h4>
                        <p className='rest'>Navigate seamlessly from Course <br></br>→ Units <br></br>→ Topics</p>
                    </div>
                    <div className="cardbox4">
                        <div className="innerbox">
                            <p className='unit_p'>UNIT PROGRESS</p>
                            <p className='unit1'>Unit 1</p>
                            <div className="progress">
                                <div className="fill1"></div>
                            </div>
                            <p className='unit1'>Unit 2</p>
                            <div className="progress">
                                <div className="fill"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                <motion.div 
                initial={{ opacity:0, y:50 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.6 }}
                className='boxof2 box3of2'>
                    <div className="cardbox5">
                        <button className='demo'>
                        <div>
                            <motion.h1
                                initial={{ width:0 }}
                                animate={{ width:"100%" }}
                                transition={{
                                    duration:3,
                                    repeat:Infinity,
                                    repeatType:"loop",
                                    repeatDelay:1
                                }}
                                style={{
                                overflow:"hidden",
                                whiteSpace:"nowrap"
                                }}>Ask your doubts...
                            </motion.h1>
                        </div>    
                        </button>
                    </div>
                    <div className="cardbox6">
                        <h4 className="top" style={{color: "rgb(102, 11, 11)"}}>Ask the AI Study Assistant</h4>
                        <p className="rest">Get instant answers, explanations, and help when concepts get difficult.</p>
                    </div>
                </motion.div>
                <motion.div 
                initial={{ opacity:0, y:50 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.6 }}
                className='boxof2 box4of2'>
                    <div className="cardbox7">
                        <h4 className='top' style={{color: "#f86e04"}}>One-Click Summarizer</h4>
                        <p className='rest'>
                            Turn long explanations into revision-ready summaries.
                            Save important summaries as personal revision assets.
                        </p>
                    </div>
                    <div className="cardbox8">
                        <button className='demo'>
                                <div>
                            <motion.h1
                                initial={{ width:0 }}
                                animate={{ width:"100%" }}
                                transition={{
                                    duration:3,
                                    repeat:Infinity,
                                    repeatType:"loop",
                                    repeatDelay:1
                                }}
                                style={{
                                overflow:"hidden",
                                whiteSpace:"nowrap"
                                }}>AI summarizer...
                            </motion.h1>
                        </div>  
                        </button>
                    </div>
                </motion.div>
            </div>
            <div className="box3" id="features">
                <div style={{ overflow: "hidden" }}>
                    <motion.p
                        className="text1 bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent"
                        initial={{ y: "100%" }}
                        whileInView={{ y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >Built for making your preparation easy!
                    </motion.p>
                </div>
                <div className="horizontal-section">
                    <div className="scroll-container" style={{color: "#226801"}}>
                        <div className="card">
                            <h4 className="top1">Your structured learning companion for Engineering.</h4>
                            <p className="rest1">Designed for students who want organized preparation without wasting time jumping between PDFs, random videos, and scattered resources.</p>
                        </div>
                        <div className="card">
                            <h4 className='top'>A short strip under hero</h4>
                            <ol className='rest list-disc pl-6'>
                                <li>Branch-wise organized content</li>
                                <li>Semester-wise structured learning</li>
                            </ol>
                        </div>
                        <div className="card">
                            <h4 className="top">AI doubt solver</h4>
                            <p className='rest'>Stuck on a concept?</p>
                            <br></br>
                            <p className='rest' id="rowbelow"> Ask instantly without leaving your study flow.</p>
                        </div>
                        <div className="card">
                            <h4 className='top'>One-Click Summarizer</h4>
                            <p className='rest'>
                                Turn long explanations into revision-ready summaries.
                                Save important summaries as personal revision assets.
                            </p>
                        </div>
                        <div className="card">
                            <h4 className='top'>Structured Navigation</h4>
                            <p className='rest'>Study exactly according to your syllabus hierarchy.</p>
                        </div>

                        <div className="card">
                            <h4 className="top1">Your structured learning companion for Engineering.</h4>
                            <p className="rest1">Designed for students who want organized preparation without wasting time jumping between PDFs, random videos, and scattered resources.</p>
                        </div>
                        <div className="card">
                            <h4 className='top1'>A short strip under hero</h4>
                            <ol className='rest list-disc pl-6'>
                                <li>Branch-wise organized content</li>
                                <li>Semester-wise structured learning</li>
                            </ol>
                        </div>
                        <div className="card">
                            <h4 className="top">AI doubt solver</h4>
                            <p className='rest'>Stuck on a concept?</p>
                            <br></br>
                            <p className='rest' id="rowbelow"> Ask instantly without leaving your study flow.</p>
                        </div>
                        <div className="card">
                            <h4 className='top'>One-Click Summarizer</h4>
                            <p className='rest'>
                                Turn long explanations into revision-ready summaries.
                                Save important summaries as personal revision assets.
                            </p>
                        </div>
                        <div className="card"></div>
                    </div>
                </div>
                <p className='b3bt'>Ease your preparation with NexStudy.</p>
            </div>
        </main>
    )
} 

export default Landing;