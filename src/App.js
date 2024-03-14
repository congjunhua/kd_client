import React, {useState} from "react"
import {Button, Card, Form, Input, Select, Switch, Timeline} from "antd"

const URL = "http://127.0.0.1:8000/"

/** 训练阶段 */
const Step = {
    ZERO: Symbol("zero"),
    TRAINING: Symbol("training"),
    EVALUATING: Symbol("evaluating"),
    COMPLETE: Symbol("complete")
}

/** 消息类型 */
const Message = {
    TIMELINE: "timeline",
    RESULT: "result",
    EVALUTION: "evaluation"
}

/** padding */
const paddingInline = "40px"

function App() {
    const [step, setStep] = useState(Step.ZERO)
    const [timeLine, setTimeLine] = useState([])
    const [results, setResults] = useState({})
    const [evaluation, setEvaluation] = useState({})

    const [form] = Form.useForm()

    function train() {
        setStep(Step.TRAINING)
        setTimeLine([])
        setResults({})
        
        if (window.EventSource) {
            let usp = new URLSearchParams(form.getFieldsValue())
            console.table(form.getFieldsValue())
            let es = new EventSource(`${URL}?${usp.toString()}`)
            es.addEventListener('message', ({data}) => {
                if (data?.startsWith(Message.TIMELINE)) {
                    let x = data.replace(`${Message.TIMELINE}:`, "")
                    timeLine.push(x)
                    setTimeLine([...timeLine])
                    return
                }
                if (data?.startsWith(Message.RESULT)) {
                    data = data.split("metrics=")[1]
                    data = data.replace(")", "")
                    data = eval(`( ${data} )`)
                    setResults(data)
                    setStep(Step.EVALUATING)
                    return
                }
                if (data?.startsWith(Message.EVALUTION)) {
                    data = data.replace("evaluation:", "")
                    data = eval(`( ${data} )`)
                    setEvaluation(data)
                    setStep(Step.COMPLETE)
                    es.close()
                }
            })
        } else {
            alert("您的浏览器不支持SSE")
        }
    }

    return (
        <>
            <h1 
                style={{
                    textAlign: "center",
                    paddingInline
                }}
            >
                Knowledge Distillation for Computer Vision
            </h1>

            <p
                style={{paddingInline}}
            >
                Knowledge distillation is a technique used to transfer knowledge from a
                larger, more complex model (teacher) to a smaller, simpler model
                (student). To distill knowledge from one model to another, we take a
                pre-trained teacher model trained on a certain task (image
                classification for this case) and randomly initialize a student model to
                be trained on image classification. Next, we train the student model to
                minimize the difference between it’s outputs and the teacher’s outputs,
                thus making it mimic the behavior. It was first introduced in Distilling
                the Knowledge in a Neural Network by Hinton et al.
            </p>

            <p
                style={{paddingInline}}
            >
                In this example, we are using the merve/beans-vit-224 model as teacher
                model. It’s an image classification model, based on
                google/vit-base-patch16-224-in21k fine-tuned on beans dataset. We will
                distill this model to a randomly initialized MobileNetV2.
            </p>

            <main
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "56px",
                    paddingInline
                }}
            >
                <div>
                    <h2>Args</h2>
                    <Form
                        labelCol={{
                            span: 14,
                        }}
                        wrapperCol={{
                            span: 20,
                        }}
                        layout="horizontal"
                        initialValues={{
                            num_train_epochs: 0.01,
                            fp16: false,
                            logging_strategy: "epoch",
                            evaluation_strategy: "epoch",
                            save_strategy: "epoch",
                            load_best_model_at_end: true,
                            temperature: 5,
                            lambda_param: 0.5

                        }}
                        size="large"
                        style={{
                            maxWidth: 600,
                        }}
                        form={form}
                    >
                        <Form.Item 
                            label="Total number of training epochs" 
                            name="num_train_epochs"
                        >
                            <Input 
                                allowClear
                                type='number'
                            />
                        </Form.Item>

                        <Form.Item 
                            label="Whether to use fp16 (mixed) precision" 
                            name="fp16"
                            valuePropName="checked"
                        >
                            <Switch
                                defaultChecked
                            />
                        </Form.Item>

                        <Form.Item 
                            label="The logging strategy to use"
                            name="logging_strategy"
                        >
                            <Select 
                                allowClear
                                defaultActiveFirstOption
                                options={[
                                    {value: 'epoch', label: <span>epoch</span> },
                                    {value: 'steps', label: <span>steps</span> }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item 
                            label="The evaluation strategy to use"
                            name="evaluation_strategy"
                        >
                            <Select 
                                allowClear
                                defaultActiveFirstOption
                                options={[
                                    {value: 'epoch', label: <span>epoch</span> },
                                    {value: 'no', label: <span>no</span> }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item 
                            label="The checkpoint save strategy to use"
                            name="save_strategy"
                        >
                            <Select 
                                allowClear
                                defaultActiveFirstOption
                                options={[
                                    {value: 'epoch', label: <span>epoch</span> },
                                    {value: 'steps', label: <span>steps</span> }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item 
                            label="Always Save the best checkpoint" 
                            name="load_best_model_at_end"
                            valuePropName="checked"
                        >
                            <Switch
                                defaultChecked
                            />
                        </Form.Item>

                        <Form.Item 
                            label="Temperature" 
                            name="temperature"
                        >
                            <Input 
                                allowClear
                                step={1}
                                type='number'
                            />
                        </Form.Item>

                        <Form.Item 
                            label="Lambda" 
                            name="lambda_param"
                        >
                            <Input 
                                allowClear
                                step={0.1}
                                type='number'
                            />
                        </Form.Item>
                    </Form>
                </div>

                {
                    timeLine.length > 0
                    &&
                    <div>
                        <h2>Timeline</h2>
                        <Timeline
                            pending={step === Step.COMPLETE ? false : step.description}
                            items={
                                timeLine?.map((s, i) => {
                                    return {
                                        children: s,
                                        color: i === 10 ? 'green' : 'blue'
                                    }
                                })
                            }
                            style={{marginTop: "32px"}}
                        />
                    </div>
                }

                {
                    timeLine.length > 0
                    &&
                    <div>
                        <h2>Results</h2>
                        <Card
                            loading={!Object.hasOwn(results, 'epoch')}
                            title="Train"
                        >
                            <div style={{display: "flex"}}>
                                Epoch: <span style={{marginLeft: "auto"}}>{results.epoch}</span>
                            </div>
                            <div style={{display: "flex"}}
                            >
                                Loss: <span style={{marginLeft: "auto"}}>{results.train_loss}</span>
                            </div>
                            <div style={{display: "flex"}}
                            >
                                Runtime: <span style={{marginLeft: "auto"}}>{results.train_runtime}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Samples Per Second: <span style={{marginLeft: "auto"}}>{results.train_samples_per_second}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Steps Per Second: <span style={{marginLeft: "auto"}}>{results.train_steps_per_second}</span>
                            </div>
                        </Card>
                        <Card
                            loading={!Object.hasOwn(evaluation, 'eval_accuracy')}
                            title="Evaluation"
                            style={{marginTop: "24px"}}
                        >
                            <div style={{display: "flex"}}>
                                Accuracy: <span style={{marginLeft: "auto"}}>{evaluation.eval_accuracy}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Epoch: <span style={{marginLeft: "auto"}}>{evaluation.epoch}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Loss: <span style={{marginLeft: "auto"}}>{evaluation.eval_loss}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Runtime: <span style={{marginLeft: "auto"}}>{evaluation.eval_runtime}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Samples Per Second: <span style={{marginLeft: "auto"}}>{evaluation.eval_samples_per_second}</span>
                            </div>
                            <div style={{display: "flex"}}>
                                Steps Per Second: <span style={{marginLeft: "auto"}}>{evaluation.eval_steps_per_second}</span>
                            </div>
                        </Card>
                    </div>
                }
            </main>

            <footer
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center"
                }}
            >
                <Button
                    style={{width: "20%"}}
                    size="large"
                    type="primary"
                    loading={step === Step.TRAINING || step === Step.EVALUATING}
                    onClick={train}
                >
                    Train
                </Button>
            </footer>
        </>
    )
}

export default App
