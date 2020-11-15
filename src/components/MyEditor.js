import React, { useState } from "react";
import { EditorState } from "draft-js";
import "draft-js/dist/Draft.css";
import Editor from "draft-js-plugins-editor";
import createLinkifyPlugin from "draft-js-linkify-plugin";

import "./MyEditor.css";

const linkifyPlugin = createLinkifyPlugin({
  target: "_blank",
  component: props => {
    const { contentState, ...rest } = props;
    return <a {...rest} onClick={() => alert("link clickedxxx!!!")} />;
  }
});
const plugins = [linkifyPlugin];

const MyEditor = () => {

  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const onChange = editorState => {
    setEditorState(editorState);
  };

  const focus = () => {
    //this.editor.focus();
  };

    return (
      <div className="editor">
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
        />
      </div>
    );
}

export default MyEditor;