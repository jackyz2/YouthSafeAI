import { useEffect, useState } from "react"
import { Plus, Trash2, Edit2, BookOpen, CircleHelp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { useApi } from "@/controller/API";
import { toast } from "@/hooks/use-toast"
import FamilyFlow from "./components/FamilyFlow"
interface Child {
  id: string
  name: string
  age?: number
}

interface UserInfo {
  user_id: string
  username: string
  is_first_time_family: boolean
}

type Step = {
  title: string 
  description: JSX.Element
  imageSrc?: string
}

export default function FamilyManagement() {
  const { addChild, removeChild, renameChild, getAllChildren } = useApi();
  const getUserInfo = async () => {
    return {
      user_id: "1",
      username: "parent_john",
      is_first_time_family: true
    } as UserInfo;
  }

  const dummy_parent = {
    id: "1",
    name: "parent_john"
  }

  const [children, setChildren] = useState<Child[]>([])
  const [newChildName, setNewChildName] = useState("")
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [newChildAge, setNewChildAge] = useState("");

  const [isLoading, setIsLoading] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [currentStep, setCurrentStep] = useState(0)

  const steps: Step[] = [
    {
      title: "Step 1: Download the Extension Files",
      description: (
        <>
          To enable Eye2AI for your child, you will need to download the Eye2AI Chrome extension files and install it on their devices.
          <br />
          <br />
          Download the Eye2AI Chrome extension files from the <a href="https://drive.google.com/file/d/1v66joVPW8X0lkkvwYUqA3OJCHY86XAgL/view?usp=sharing" target="_blank" rel="noopener noreferrer">Google Drive</a>.
          <br />
          <br />
          Ensure you have all the necessary files for the Eye2AI Chrome extension, including <code>manifest.json</code> and <code>background.js</code>.
          <br />
          <br />
          The extension automatically monitors and detects your child's chat content when they are chatting with a Character.AI agent, and presents the detected risky interactions on the parental dashboard.
        </>
      ),
      imageSrc: "/images/download_extension.png"
    },
    {
      title: "Step 2: Open Chrome Extensions Page",
      description: (
        <>
          Open Google Chrome and navigate to <code>chrome://extensions/</code> in the address bar.
          <br />
          <br />
          This will open the Extensions management page in Chrome.
        </>
      ),
      imageSrc: "/images/chrome_extension_page.png"
    },
    {
      title: "Step 3: Enable Developer Mode",
      description: (
        <>
          In the top right corner of the extensions page, toggle the <strong>Developer mode</strong> switch to the "on" position.
          <br />
          <br />
          This allows you to load unpacked extensions from your local machine.
        </>
      ),
      imageSrc: "/images/developer_mode.png"
    },
    {
      title: "Step 4: Load Unpacked Extension",
      description: (
        <>
          Click on the <strong>"Load unpacked"</strong> button.
          <br />
          <br />
          Select the directory where your extension files are located.
        </>
      ),
      imageSrc: "/images/load_unpacked.png"
    },
    {
      title: "Step 5: Verify Installation",
      description: (
        <>
          Once loaded, you should see the Eye2AI extension in your list of installed extensions.
          <br />
          <br />
          Ensure the extension is enabled.
        </>
      ),
      imageSrc: "/images/enabled.png"
    },
    {
      title: "Installation Complete!",
      description: (
        <>
          The Eye2AI extension is now installed and ready to use.
          <br />
          <br />
          You can find it in your Chrome toolbar. Click the extension icon to login and select your child after you have set up your family in the family management page.
          <br />
          <br />
          Once set up, the extension will automatically monitor and detect your child's chat content when they are chatting with a Character.AI agent.
        </>
      ),
      imageSrc: "/images/extension_login.png"
    },
  ]

  const handleAddChild = () => {
    if (!newChildName.trim() || !newChildAge.trim()) {
      toast({
        title: "Error",
        description: "Child name and age are required",
        variant: "destructive",
      });
      return;
    }

    if (children.some(child => child.name === newChildName)) {
      toast({
        title: "Error",
        description: "Child name already exists",
        variant: "destructive",
      });
      return;
    }

    addChild({
      parent_user_id: dummy_parent.id,
      child_name: newChildName,
      child_age: parseInt(newChildAge),
    });
    setNewChildName("");
    setNewChildAge("");
    setIsLoading(true);
  };

  const handleDeleteChild = (id: string) => {
    removeChild({ parent_user_id: dummy_parent.id, child_user_id: id.toString() });
    setIsLoading(true);
  }

  const startEditingChild = (child: Child) => {
    setEditingChild(child)
  }

  const saveEditedChild = () => {
    if (editingChild && editingChild.name.trim()) {
      renameChild({ child_user_id: editingChild.id.toString(), new_name: editingChild.name.trim() });
      setIsLoading(true);
    }
  }

  const handleOpenInstallationGuide = () => {
    setIsFirstTime(true);
    setCurrentStep(0);
  };

  useEffect(() => {
    // Check localStorage for first-time status
    const firstTimeStatus = localStorage.getItem('isFirstTimeFamily');
    if (firstTimeStatus === null || firstTimeStatus === 'true') {
      setIsFirstTime(true);
    } else {
      setIsFirstTime(false);
    }

    getUserInfo().then((userInfo: UserInfo) => {
      // if (userInfo.is_first_time_family) {
      //   setIsFirstTime(true);
      // }
    });

    getAllChildren().then(
      (res: any) => {
        setChildren(res.data.map((child: any) => ({ id: child.child_user_id, name: child.children.username, age: child.children.user_age })) as Child[])
      }
    );
    setIsLoading(false);
  }, [isLoading]);

  return (
    <div className="container mx-auto p-4">
      {isFirstTime && (
        <Dialog open={isFirstTime} onOpenChange={setIsFirstTime}>
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{steps[currentStep].title}</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              {steps[currentStep].description}
              {steps[currentStep].imageSrc && (
                <img
                  src={steps[currentStep].imageSrc}
                  alt={`Installation guide step ${currentStep + 1}`}
                  className="mt-4 max-w-full h-auto"
                />
              )}
            </DialogDescription>
            <DialogFooter>
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => {
                  setCurrentStep(currentStep + 1)
                  // setIsFirstTime(false)
                  localStorage.setItem('isFirstTimeFamily', 'false');
                }}>Next</Button>
              ) : (
                <Button
                  onClick={() => {
                    setIsFirstTime(false)
                    localStorage.setItem('isFirstTimeFamily', 'false');
                  }}
                >
                  Finish
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex justify-start items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold">Family Management</h2>
        <Button variant="outline" className="h-6 bg-blue-500 text-white" onClick={handleOpenInstallationGuide}>
          <span className="flex items-center">
            <CircleHelp className="mr-2 h-4 w-4" /> 
            Installation Guide
          </span>
        </Button>
      </div>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add a child to your family</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Enter child's name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
              />
              <Input
                placeholder="Enter child's age"
                value={newChildAge}
                onChange={(e) => setNewChildAge(e.target.value)}
              />
              <Button onClick={handleAddChild}>
                <Plus className="mr-2 h-4 w-4" /> Add Child
              </Button>
            </div>
            <div className="space-y-2">
              {children.map(child => (
                <div key={child.id} className="flex items-center justify-between p-2 border rounded">
                  <span>
                    {child.name}{" "}
                    {child.age !== undefined && child.age !== null
                      ? `(Age: ${child.age})`
                      : "(Age: N/A)"}
                  </span>
                  <div className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => startEditingChild(child)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Edit Child's Name</DialogTitle>
                          <DialogDescription>
                            Enter the new name for {child.name}.
                          </DialogDescription>
                        </DialogHeader>
                        <Input
                          value={editingChild?.name || ""}
                          onChange={(e) => setEditingChild(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={saveEditedChild}>Save Changes</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will remove {child.name} from your family management. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteChild(child.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <FamilyFlow parent_name={dummy_parent.name} children={children} />
        </CardContent>
      </Card>
    </div>
  )
}

